// src/items/items.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Item } from './entities/item.entity';

@Injectable()
export class ItemsService {
  private items: Item[] = [];
  private nextId = 1;

  private checkNaN(id: number) {
    if (isNaN(id)) {
      throw new BadRequestException({ error: 'Invalid item ID' });
    }
  }

  create(createItemDto: CreateItemDto): Item {
    const newItem = new Item(
      this.nextId++,
      createItemDto.name.trim(),
      createItemDto.description.trim(),
    );

    this.items.push(newItem);
    return newItem;
  }

  findAll(): Item[] {
    return this.items;
  }

  findOne(id: number): Item {
    this.checkNaN(id);
    const item = this.items.find((item) => item.id === id);

    if (!item) {
      throw new NotFoundException({ error: 'Item not found' });
    }

    return item;
  }

  update(id: number, updateItemDto: UpdateItemDto): Item {
    this.checkNaN(id);
    const itemIndex = this.items.findIndex((item) => item.id === id);

    if (itemIndex === -1) {
      throw new NotFoundException({ error: 'Item not found' });
    }

    this.items[itemIndex] = new Item(
      id,
      updateItemDto.name.trim(),
      updateItemDto.description.trim(),
    );

    return this.items[itemIndex];
  }

  remove(id: number): { message: string; item: Item } {
    this.checkNaN(id);
    const itemIndex = this.items.findIndex((item) => item.id === id);

    if (itemIndex === -1) {
      throw new NotFoundException({ error: 'Item not found' });
    }

    const deletedItem = this.items.splice(itemIndex, 1)[0];
    return { message: 'Item deleted', item: deletedItem };
  }

  // Method to reset data (for testing purposes)
  resetData(): void {
    this.items = [];
    this.nextId = 1;
  }
}
