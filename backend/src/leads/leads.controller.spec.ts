import { LeadsController } from './leads.controller';

describe('LeadsController', () => {
  const leadsServiceMock = {
    createLead: jest.fn(),
    presignPicture: jest.fn(),
    attachPicture: jest.fn(),
  };

  let controller: LeadsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new LeadsController(leadsServiceMock as any);
  });

  it('POST /leads -> calls leadsService.createLead(dto)', async () => {
    const dto: any = {
      salutation: 'MALE',
      firstName: 'John',
      lastName: 'Doe',
      postalCode: '10115',
      email: 'john@example.com',
      phone: '+49123456789',
      newsletterSingleOptIn: false,
    };

    leadsServiceMock.createLead.mockResolvedValue({
      success: true,
      message: 'Lead successfully created',
      leadId: 'lead123',
      pictureToken: 'token123',
    });

    const res = await controller.createLead(dto);

    expect(leadsServiceMock.createLead).toHaveBeenCalledTimes(1);
    expect(leadsServiceMock.createLead).toHaveBeenCalledWith(dto);

    expect(res).toEqual({
      success: true,
      message: 'Lead successfully created',
      leadId: 'lead123',
      pictureToken: 'token123',
    });
  });

  it('POST /leads/:id/pictures/presign -> calls leadsService.presignPicture({ leadId, body })', async () => {
    const leadId = 'lead123';
    const body: any = { fileName: 'a.png', contentType: 'image/png' };

    leadsServiceMock.presignPicture.mockResolvedValue({
      url: 'https://s3-upload',
      fields: { key: 'k' },
      accessUrl: 'https://signed-get',
      key: 'leads/lead123/a.png',
    });

    const res = await controller.presignPicture(leadId, body);

    expect(leadsServiceMock.presignPicture).toHaveBeenCalledTimes(1);
    expect(leadsServiceMock.presignPicture).toHaveBeenCalledWith({
      leadId,
      body,
    });

    expect(res).toEqual({
      url: 'https://s3-upload',
      fields: { key: 'k' },
      accessUrl: 'https://signed-get',
      key: 'leads/lead123/a.png',
    });
  });

  it('POST /leads/:id/pictures -> calls leadsService.attachPicture({ leadId, body })', async () => {
    const leadId = 'lead123';
    const body: any = {
      key: 'leads/lead123/a.png',
      mimeType: 'image/png',
      originalName: 'a.png',
    };

    leadsServiceMock.attachPicture.mockResolvedValue({
      success: true,
      message: 'Picture attached',
    });

    const res = await controller.attachPicture(leadId, body);

    expect(leadsServiceMock.attachPicture).toHaveBeenCalledTimes(1);
    expect(leadsServiceMock.attachPicture).toHaveBeenCalledWith({
      leadId,
      body,
    });

    expect(res).toEqual({
      success: true,
      message: 'Picture attached',
    });
  });
});
