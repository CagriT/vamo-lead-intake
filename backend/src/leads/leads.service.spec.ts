import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { LeadsService } from './leads.service';
import { CRM_SERVICE } from '../crm/crm.constants';
import { S3Service } from '../s3/s3.service';
import { Lead } from './schemas/lead.schema';
import { LeadPictureTokenService } from './lead-picture-token.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { Salutation } from './salutation.enum';

describe('LeadsService', () => {
  let service: LeadsService;

  const mockLeadInstance = {
    save: jest.fn(),
    _id: { toString: () => 'lead123' },
  };

  type MockLeadModel = jest.Mock & { findByIdAndUpdate: jest.Mock };

  const mockLeadModel: MockLeadModel = Object.assign(
    jest.fn(() => mockLeadInstance),
    { findByIdAndUpdate: jest.fn() },
  );

  const mockCrmService = {
    createLead: jest.fn(),
    attachLeadPicture: jest.fn(),
  };

  const mockS3Service = {
    generatePresignedUploadUrl: jest.fn(),
    generatePresignedGetUrl: jest.fn(),
    verifyUploadedObject: jest.fn(),
  };

  const mockTokenService = {
    signForLead: jest.fn().mockReturnValue('mock-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: getModelToken(Lead.name), useValue: mockLeadModel },
        { provide: CRM_SERVICE, useValue: mockCrmService },
        { provide: S3Service, useValue: mockS3Service },
        { provide: LeadPictureTokenService, useValue: mockTokenService },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('createLead returns leadId and pictureToken', async () => {
    const dto: CreateLeadDto = {
      salutation: Salutation.MALE,
      firstName: 'Test',
      lastName: 'User',
      postalCode: '10115',
      email: 'test@example.com',
      phone: '123456',
      newsletterSingleOptIn: false,
    };

    mockLeadInstance.save.mockResolvedValue(undefined);

    const result = await service.createLead(dto);

    expect(mockLeadModel).toHaveBeenCalledWith(dto);
    expect(mockLeadInstance.save).toHaveBeenCalled();
    expect(mockCrmService.createLead).toHaveBeenCalledWith({
      lead: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        postalCode: dto.postalCode,
        salutation: dto.salutation,
      },
    });
    expect(mockTokenService.signForLead).toHaveBeenCalledWith({
      leadId: 'lead123',
    });
    expect(result).toEqual({
      success: true,
      message: 'Lead successfully created',
      leadId: 'lead123',
      pictureToken: 'mock-token',
    });
  });

  it('presignPicture calls S3Service with correct params', async () => {
    const params = {
      leadId: 'lead123',
      body: { fileName: 'photo.jpg', contentType: 'image/jpeg' },
    };

    mockS3Service.generatePresignedUploadUrl.mockResolvedValue({
      url: 'https://s3-presigned-post',
      fields: { key: 'x' },
      accessUrl: 'https://s3-presigned-get',
      key: 'leads/lead123/photo.jpg',
    });

    const result = await service.presignPicture(params);

    expect(mockS3Service.generatePresignedUploadUrl).toHaveBeenCalledWith({
      leadId: params.leadId,
      fileName: params.body.fileName,
      contentType: params.body.contentType,
    });
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('fields');
    expect(result).toHaveProperty('accessUrl');
    expect(result).toHaveProperty('key');
  });

  it('attachPicture updates lead and calls CRM with fresh access URL', async () => {
    const params = {
      leadId: 'lead123',
      body: {
        key: 'leads/lead123/photo.jpg',
        mimeType: 'image/jpeg',
        originalName: 'photo.jpg',
      },
    };

    mockLeadModel.findByIdAndUpdate.mockResolvedValue({ _id: params.leadId });
    mockS3Service.generatePresignedGetUrl.mockResolvedValue(
      'https://s3-presigned-get',
    );

    const result = await service.attachPicture(params);

    expect(mockS3Service.verifyUploadedObject).toHaveBeenCalledWith({
      key: params.body.key,
      expectedContentType: params.body.mimeType,
      leadId: params.leadId,
    });
    expect(mockLeadModel.findByIdAndUpdate).toHaveBeenCalledWith(
      params.leadId,
      { $push: { pictures: params.body } },
      { new: true },
    );
    expect(mockS3Service.generatePresignedGetUrl).toHaveBeenCalledWith(
      params.body.key,
    );
    expect(mockCrmService.attachLeadPicture).toHaveBeenCalledWith({
      leadId: params.leadId,
      pictureUrl: 'https://s3-presigned-get',
    });
    expect(result).toEqual({
      success: true,
      message: 'Picture attached',
    });
  });

  it('attachPicture throws if uploaded object fails verification', async () => {
    const params = {
      leadId: 'lead123',
      body: {
        key: 'leads/lead123/photo.jpg',
        mimeType: 'image/jpeg',
        originalName: 'photo.jpg',
      },
    };

    mockLeadModel.findByIdAndUpdate.mockResolvedValue({ _id: params.leadId });
    mockS3Service.verifyUploadedObject.mockRejectedValue(
      new Error('Uploaded file type mismatch'),
    );

    await expect(service.attachPicture(params)).rejects.toThrow(
      'Uploaded file type mismatch',
    );
    expect(mockS3Service.verifyUploadedObject).toHaveBeenCalledWith({
      key: params.body.key,
      expectedContentType: params.body.mimeType,
      leadId: params.leadId,
    });
    expect(mockS3Service.generatePresignedGetUrl).not.toHaveBeenCalled();
    expect(mockCrmService.attachLeadPicture).not.toHaveBeenCalled();
  });

  it('attachPicture throws if lead is not found', async () => {
    const params = {
      leadId: 'missing-lead',
      body: {
        key: 'leads/missing-lead/photo.jpg',
        mimeType: 'image/jpeg',
        originalName: 'photo.jpg',
      },
    };

    mockLeadModel.findByIdAndUpdate.mockResolvedValue(null);

    await expect(service.attachPicture(params)).rejects.toThrow(
      'Lead not found',
    );
    expect(mockCrmService.attachLeadPicture).not.toHaveBeenCalled();
  });
});
