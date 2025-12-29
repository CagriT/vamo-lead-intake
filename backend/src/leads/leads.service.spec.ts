import { LeadsService } from './leads.service';
import { CRM_SERVICE } from '../crm/crm.constants';
import { Types } from 'mongoose';

describe('LeadsService', () => {
  // --- Mongoose model mock (constructor + static methods) ---
  const save = jest.fn();
  const leadIdObj = new Types.ObjectId();
  const mockLeadDoc = { _id: leadIdObj, save };

  const LeadModelMock: any = jest.fn().mockImplementation(() => mockLeadDoc);
  LeadModelMock.findByIdAndUpdate = jest.fn();

  // --- dependency mocks ---
  const crmMock = {
    createLead: jest.fn(),
    attachLeadPicture: jest.fn(),
  };

  const s3Mock = {
    generatePresignedUploadUrl: jest.fn(),
    verifyUploadedObject: jest.fn(),
    generatePresignedGetUrl: jest.fn(),
  };

  const tokenServiceMock = {
    signForLead: jest.fn(),
  };

  let service: LeadsService;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset defaults
    save.mockResolvedValue(undefined);
    tokenServiceMock.signForLead.mockReturnValue('picture-token');

    service = new LeadsService(
      LeadModelMock,
      // Inject token by string in real module; in unit test we pass the instance
      crmMock as unknown as any, // CRM_SERVICE
      s3Mock as unknown as any,
      tokenServiceMock as unknown as any,
    );
  });

  describe('createLead', () => {
    it('creates lead in Mongo and returns leadId + pictureToken', async () => {
      const dto: any = {
        salutation: 'MALE',
        firstName: 'John',
        lastName: 'Doe',
        postalCode: '10115',
        email: 'john@example.com',
        phone: '+49123456789',
        newsletterSingleOptIn: false,
      };

      crmMock.createLead.mockResolvedValue(undefined);

      const res = await service.createLead(dto);

      expect(LeadModelMock).toHaveBeenCalledWith(dto);
      expect(save).toHaveBeenCalledTimes(1);

      expect(tokenServiceMock.signForLead).toHaveBeenCalledWith({
        leadId: leadIdObj.toString(),
      });

      expect(res).toEqual({
        success: true,
        message: 'Lead successfully created',
        leadId: leadIdObj.toString(),
        pictureToken: 'picture-token',
      });

      // Fire-and-forget CRM call should be made
      expect(crmMock.createLead).toHaveBeenCalledTimes(1);
      expect(crmMock.createLead).toHaveBeenCalledWith({
        lead: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone,
          postalCode: dto.postalCode,
          salutation: dto.salutation,
        },
      });
    });

    it('does NOT fail lead creation if CRM throws (fire-and-forget)', async () => {
      const consoleSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => undefined);

      const dto: any = {
        salutation: 'FEMALE',
        firstName: 'Jane',
        lastName: 'Doe',
        postalCode: '10115',
        email: 'jane@example.com',
        phone: '+49123456789',
        newsletterSingleOptIn: false,
      };

      crmMock.createLead.mockRejectedValue(new Error('crm down'));

      const res = await service.createLead(dto);

      expect(res.success).toBe(true);
      expect(save).toHaveBeenCalledTimes(1);
      expect(crmMock.createLead).toHaveBeenCalledTimes(1);

      consoleSpy.mockRestore();
    });
  });

  describe('presignPicture', () => {
    it('delegates to S3Service.generatePresignedUploadUrl', async () => {
      const leadId = 'lead123';
      const body = { fileName: 'a.png', contentType: 'image/png' };

      s3Mock.generatePresignedUploadUrl.mockResolvedValue({
        url: 'https://s3-upload',
        fields: { key: 'k' },
        accessUrl: 'https://s3-access',
        key: 'leads/lead123/x.png',
      });

      const res = await service.presignPicture({ leadId, body } as any);

      expect(s3Mock.generatePresignedUploadUrl).toHaveBeenCalledWith({
        leadId,
        fileName: body.fileName,
        contentType: body.contentType,
      });

      expect(res).toEqual({
        url: 'https://s3-upload',
        fields: { key: 'k' },
        accessUrl: 'https://s3-access',
        key: 'leads/lead123/x.png',
      });
    });
  });

  describe('attachPicture', () => {
    it('verifies uploaded object, saves metadata, and forwards signed GET to CRM', async () => {
      const leadId = 'lead123';
      const body = {
        key: 'leads/lead123/file.png',
        mimeType: 'image/png',
        originalName: 'file.png',
      };

      s3Mock.verifyUploadedObject.mockResolvedValue(undefined);
      LeadModelMock.findByIdAndUpdate.mockResolvedValue({
        _id: leadId,
        pictures: [body],
      });
      s3Mock.generatePresignedGetUrl.mockResolvedValue(
        'https://signed-get-url',
      );
      crmMock.attachLeadPicture.mockResolvedValue(undefined);

      const res = await service.attachPicture({ leadId, body } as any);

      expect(s3Mock.verifyUploadedObject).toHaveBeenCalledWith({
        key: body.key,
        expectedContentType: body.mimeType,
        leadId,
      });

      expect(LeadModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
        leadId,
        { $push: { pictures: body } },
        { new: true },
      );

      expect(s3Mock.generatePresignedGetUrl).toHaveBeenCalledWith(body.key);
      expect(crmMock.attachLeadPicture).toHaveBeenCalledWith({
        leadId,
        pictureUrl: 'https://signed-get-url',
      });

      expect(res).toEqual({
        success: true,
        message: 'Picture attached',
      });
    });

    it('throws if S3 verification fails (does not write to DB)', async () => {
      const leadId = 'lead123';
      const body = {
        key: 'leads/lead123/file.png',
        mimeType: 'image/png',
        originalName: 'file.png',
      };

      s3Mock.verifyUploadedObject.mockRejectedValue(
        new Error('S3 verify failed'),
      );

      await expect(
        service.attachPicture({ leadId, body } as any),
      ).rejects.toThrow('S3 verify failed');

      expect(LeadModelMock.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(crmMock.attachLeadPicture).not.toHaveBeenCalled();
    });

    it('throws if lead not found after DB update attempt', async () => {
      const leadId = 'lead123';
      const body = {
        key: 'leads/lead123/file.png',
        mimeType: 'image/png',
        originalName: 'file.png',
      };

      s3Mock.verifyUploadedObject.mockResolvedValue(undefined);
      LeadModelMock.findByIdAndUpdate.mockResolvedValue(null);

      await expect(
        service.attachPicture({ leadId, body } as any),
      ).rejects.toThrow('Lead not found');

      expect(s3Mock.verifyUploadedObject).toHaveBeenCalled();
      expect(s3Mock.generatePresignedGetUrl).not.toHaveBeenCalled();
      expect(crmMock.attachLeadPicture).not.toHaveBeenCalled();
    });
  });

  // This is only here so the test file documents intent:
  // In Nest DI, CRM is injected via CRM_SERVICE token.
  void CRM_SERVICE;
});
