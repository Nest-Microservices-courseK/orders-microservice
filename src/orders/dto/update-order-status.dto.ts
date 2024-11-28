import { OrderStatus } from '@prisma/client';
import { IsEnum, IsNumber, IsPositive } from 'class-validator';
import { OrderStatusList } from 'src/orders/enum/order.enum';

export class UpdateOrderStatusDto {
  @IsNumber()
  @IsPositive()
  id: number;

  @IsEnum(OrderStatusList, {
    message: `Status must be one of the following: ${Object.values(OrderStatusList)}`,
  })
  status: OrderStatus = OrderStatus.PENDING;
}
