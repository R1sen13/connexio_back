import { AuthService } from './auth.service';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../infrastracture/prisma/prisma.service';
import { RedisService } from '../../infrastracture/redis/redis.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const multiMock = {
    hSet: jest.fn().mockReturnThis(),
    expire: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  };

  const redisClientMock = {
    hGetAll: jest.fn(),
    del: jest.fn(),
    multi: jest.fn().mockReturnValue(multiMock),
  };

  const redisMock = {
    getClient: jest.fn().mockReturnValue(redisClientMock),
  };

  const jwtMock = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: RedisService,
          useValue: redisMock,
        },
        {
          provide: JwtService,
          useValue: jwtMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('registers a new user and creates tokens', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    prismaMock.user.create.mockResolvedValue({
      id: 'user-id',
      email: 'admin@gmail.com',
      passwordHash: 'hashed-password',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    jwtMock.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');

    const result = await service.register({
      email: 'admin@gmail.com',
      password: 'password',
    });

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    expect(prismaMock.user.create).toHaveBeenCalled();
    expect(redisClientMock.multi).toHaveBeenCalled();
  });

  it('registers an existing user', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-id',
      email: 'admin@gmail.com',
      passwordHash: 'hashed-password',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      service.register({
        email: 'admin@gmail.com',
        password: 'password',
      }),
    ).rejects.toThrow('Authentication error! Try again');

    expect(prismaMock.user.create).not.toHaveBeenCalled();
    expect(redisMock.getClient).not.toHaveBeenCalled();
    expect(jwtMock.signAsync).not.toHaveBeenCalled();
  });
});
