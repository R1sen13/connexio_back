import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  constructor() {}

  checkHealth() {
    return 'Server is up and running!';
  }
}
