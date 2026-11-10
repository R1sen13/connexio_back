import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(() => {
    service = new HealthService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return the server health message', () => {
    expect(service.checkHealth()).toBe('Server is up and running!');
  });
});
