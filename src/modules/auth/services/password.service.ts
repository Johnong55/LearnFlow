import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import argon2 from 'argon2';

@Injectable()
export class PasswordService {
  constructor(private readonly config: ConfigService) {}

  hash(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: this.config.get<number>('auth.argonMemoryCost', 19456),
      timeCost: this.config.get<number>('auth.argonTimeCost', 2),
      parallelism: this.config.get<number>('auth.argonParallelism', 1),
    });
  }

  verify(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }
}
