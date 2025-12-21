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
    expect(mockCrmService.createLead).toHaveBeenCalled();
    expect(mockTokenService.signForLead).toHaveBeenCalledWith('lead123');
    expect(result).toEqual({
      success: true,
      message: 'Lead successfully created',
      leadId: 'lead123',
      pictureToken: 'mock-token',
    });
  });

  it('presignPicture calls S3Service with correct params', async () => {
    const leadId = 'lead123';
    const body = { fileName: 'photo.jpg', contentType: 'image/jpeg' };

    mockS3Service.generatePresignedUploadUrl.mockResolvedValue({
      url: 'https://s3-presigned-post',
      fields: { key: 'x' },
      accessUrl: 'https://s3-presigned-get',
      key: 'leads/lead123/photo.jpg',
    });

    const result = await service.presignPicture(leadId, body);

    expect(mockS3Service.generatePresignedUploadUrl).toHaveBeenCalledWith(
      leadId,
      body.fileName,
      body.contentType,
    );
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('fields');
    expect(result).toHaveProperty('accessUrl');
    expect(result).toHaveProperty('key');
  });

  it('attachPicture updates lead and calls CRM with fresh access URL', async () => {
    const leadId = 'lead123';
    const body = {
      key: 'leads/lead123/photo.jpg',
      mimeType: 'image/jpeg',
      originalName: 'photo.jpg',
    };

    mockLeadModel.findByIdAndUpdate.mockResolvedValue({ _id: leadId });
    mockS3Service.generatePresignedGetUrl.mockResolvedValue(
      'https://s3-presigned-get',
    );

    const result = await service.attachPicture(leadId, body);

    expect(mockS3Service.verifyUploadedObject).toHaveBeenCalledWith(
      body.key,
      body.mimeType,
      leadId,
    );
    expect(mockLeadModel.findByIdAndUpdate).toHaveBeenCalledWith(
      leadId,
      { $push: { pictures: body } },
      { new: true },
    );
    expect(mockS3Service.generatePresignedGetUrl).toHaveBeenCalledWith(
      body.key,
    );
    expect(mockCrmService.attachLeadPicture).toHaveBeenCalledWith(
      leadId,
      'https://s3-presigned-get',
    );
    expect(result).toEqual({
      success: true,
      message: 'Picture attached',
    });
  });

  it('attachPicture throws if uploaded object fails verification', async () => {
    const leadId = 'lead123';
    const body = {
      key: 'leads/lead123/photo.jpg',
      mimeType: 'image/jpeg',
      originalName: 'photo.jpg',
    };

    mockLeadModel.findByIdAndUpdate.mockResolvedValue({ _id: leadId });
    mockS3Service.verifyUploadedObject.mockRejectedValue(
      new Error('Uploaded file type mismatch'),
    );

    await expect(service.attachPicture(leadId, body)).rejects.toThrow(
      'Uploaded file type mismatch',
    );
    expect(mockS3Service.verifyUploadedObject).toHaveBeenCalledWith(
      body.key,
      body.mimeType,
      leadId,
    );
    expect(mockS3Service.generatePresignedGetUrl).not.toHaveBeenCalled();
    expect(mockCrmService.attachLeadPicture).not.toHaveBeenCalled();
  });

  it('attachPicture throws if lead is not found', async () => {
    const leadId = 'missing-lead';
    const body = {
      key: 'leads/missing-lead/photo.jpg',
      mimeType: 'image/jpeg',
      originalName: 'photo.jpg',
    };

    mockLeadModel.findByIdAndUpdate.mockResolvedValue(null);

    await expect(service.attachPicture(leadId, body)).rejects.toThrow(
      'Lead not found',
    );
    expect(mockCrmService.attachLeadPicture).not.toHaveBeenCalled();
  });
});
