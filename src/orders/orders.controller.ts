import { Controller, NotImplementedException } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateOrderDto } from 'src/orders/dto/create-order.dto';
import { OrderPaginationDto } from 'src/orders/dto/order-pagination.dto';
import { UpdateOrderStatusDto } from 'src/orders/dto/update-order-status.dto';
import { OrdersService } from 'src/orders/orders.service';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern({ cmd: 'find_all_orders' })
  findAll(@Payload() orderPaginationDto: OrderPaginationDto) {
    return this.ordersService.findAll(orderPaginationDto);
  }

  @MessagePattern({ cmd: 'find_one_order' })
  findOne(@Payload('id') id: number) {
    return this.ordersService.findOne(id);
  }

  @MessagePattern({ cmd: 'create_order' })
  create(@Payload() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @MessagePattern({ cmd: 'change_order_status' })
  update(@Payload() updateOrderDto: UpdateOrderStatusDto) {
    return this.ordersService.changeStatus(updateOrderDto.id, updateOrderDto);
  }
}
