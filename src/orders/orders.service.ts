import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OrderPaginationDto } from 'src/orders/dto/order-pagination.dto';
import { UpdateOrderStatusDto } from 'src/orders/dto/update-order-status.dto';
import { CreateOrderDto } from 'src/orders/dto/create-order.dto';
import { PRODUCT_SERVICE } from 'src/config/services';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  constructor(
    @Inject(PRODUCT_SERVICE) private readonly productsClient: ClientProxy,
  ) {
    super();
  }

  private readonly logger = new Logger(OrdersService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to the database');
  }

  async create(createOrderDto: CreateOrderDto) {
    try {
      const ids = createOrderDto.items.map(({ productId }) => productId);
      const products: any[] = await firstValueFrom(
        this.productsClient.send({ cmd: 'validate_products' }, ids),
      );

      const totalAmount = createOrderDto.items.reduce((acc, orderItem) => {
        const item = products.find(
          (product) => product.id === orderItem.productId,
        ).price;
        return acc + item * orderItem.quantity;
      }, 0);

      const totalItems = createOrderDto.items.reduce(
        (acc, orderItem) => acc + orderItem.quantity,
        0,
      );

      const order = await this.order.create({
        data: {
          totalAmount,
          totalItems,
          OrderItem: {
            createMany: {
              data: createOrderDto.items.map((orderItem) => ({
                productId: orderItem.productId,
                quantity: orderItem.quantity,
                price: products.find(
                  (product) => product.id === orderItem.productId,
                ).price,
              })),
            },
          },
        },
        include: {
          OrderItem: {
            select: { price: true, quantity: true, productId: true },
          },
        },
      });

      return {
        ...order,
        OrderItem: order.OrderItem.map((item) => {
          const product = products.find(
            (product) => product.id === item.productId,
          );
          return {
            ...item,
            name: product.name,
          };
        }),
      };
    } catch (err) {
      throw new RpcException({
        message: err.message,
        status: HttpStatus.BAD_REQUEST,
      });
    }
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
      include: {
        OrderItem: { select: { price: true, quantity: true, productId: true } },
      },
    });

    if (!order) {
      throw new RpcException({
        message: `Order with id ${id} not found`,
        status: HttpStatus.BAD_REQUEST,
      });
    }

    const prodIds = order.OrderItem.map((item) => item.productId);
    const products: any[] = await firstValueFrom(
      this.productsClient.send({ cmd: 'validate_products' }, prodIds),
    );

    return {
      ...order,
      OrderItem: order.OrderItem.map((item) => {
        const product = products.find(
          (product) => product.id === item.productId,
        );
        return {
          ...item,
          name: product.name,
        };
      }),
    };
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
