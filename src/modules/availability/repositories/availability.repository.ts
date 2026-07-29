import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@Injectable()
export class AvailabilityRepository {
  constructor(private readonly prisma: PrismaService) {}
  list(userId: string) {
    return this.prisma.availabilityRule.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ type: 'asc' }, { startTime: 'asc' }],
    });
  }
  findOwned(userId: string, id: string) {
    return this.prisma.availabilityRule.findFirst({ where: { id, userId, deletedAt: null } });
  }
  create(userId: string, data: Prisma.AvailabilityRuleCreateWithoutUserInput) {
    return this.prisma.availabilityRule.create({
      data: { ...data, user: { connect: { id: userId } } },
    });
  }
  update(userId: string, id: string, data: Prisma.AvailabilityRuleUpdateInput) {
    return this.prisma.availabilityRule.update({ where: { id, userId, deletedAt: null }, data });
  }
  softDelete(userId: string, id: string) {
    return this.prisma.availabilityRule.update({
      where: { id, userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
