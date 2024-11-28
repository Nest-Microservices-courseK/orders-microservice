import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { OrderPaginationDto } from 'src/orders/dto/order-pagination.dto';
import { UpdateOrderStatusDto } from 'src/orders/dto/update-order-status.dto';
import { CreateOrderDto } from 'src/orders/dto/create-order.dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(OrdersService.name);
  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to the database');
  }

  create(createOrderDto: CreateOrderDto) {
    return this.order.create({
      data: createOrderDto,
    });
  }

  async findAll(orderPaginationDto: OrderPaginationDto) {
    const { limit, page } = orderPaginationDto;

    const totalPages = await this.order.count();
    const lastPage = Math.ceil(totalPages / limit);

    return {
      data: await this.order.findMany({
        where: { status: orderPaginationDto.status },
        take: limit,
        skip: (page - 1) * limit,
      }),
      meta: {
        total: totalPages,
        page,
        lastPage,
      },
    };
  }

  async findOne(id: number) {
    const order = await this.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new RpcException({
        message: `Order with id ${id} not found`,
        status: HttpStatus.BAD_REQUEST,
      });
    }

    return order;
  }

  async changeStatus(id: number, { status }: UpdateOrderStatusDto) {
    const order = await this.findOne(id);

    if (order.status === status) {
      return { id: order.id, status: order.status };
    }

    return this.order.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });
  }
}
