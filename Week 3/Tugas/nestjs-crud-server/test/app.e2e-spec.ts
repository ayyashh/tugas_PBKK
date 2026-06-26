/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { ItemsService } from '../src/items/items.service';
import { Server } from 'node:net';
import { initApp } from '../src/app.init';

describe('AppController (e2e)', () => {
  let nest: INestApplication<App>;
  let app: Server;
  let itemService: ItemsService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    nest = moduleFixture.createNestApplication();
    initApp(nest);
    itemService = moduleFixture.get<ItemsService>(ItemsService);
    itemService.resetData();
    app = nest.getHttpServer() as Server;
    await nest.init();
  });

  // GET /items tests
  describe('GET /items', () => {
    it('should return empty array initially', async () => {
      const response = await request(app).get('/items').expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all items', async () => {
      // Create test items first
      await request(app)
        .post('/items')
        .send({ name: 'Item 1', description: 'Description 1' });

      await request(app)
        .post('/items')
        .send({ name: 'Item 2', description: 'Description 2' });

      const response = await request(app).get('/items').expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        id: 1,
        name: 'Item 1',
        description: 'Description 1',
      });
      expect(response.body[1]).toMatchObject({
        id: 2,
        name: 'Item 2',
        description: 'Description 2',
      });
    });

    it('should have correct content type', async () => {
      const response = await request(app).get('/items').expect(200);

      expect(response.headers['content-type']).toContain('application/json');
    });
  });

  // GET /items/:id tests
  describe('GET /items/:id', () => {
    beforeEach(async () => {
      await request(app)
        .post('/items')
        .send({ name: 'Test Item', description: 'Test Description' });
    });

    it('should return specific item by ID', async () => {
      const response = await request(app).get('/items/1').expect(200);

      expect(response.body).toMatchObject({
        id: 1,
        name: 'Test Item',
        description: 'Test Description',
      });
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app).get('/items/999').expect(404);

      expect(response.body).toEqual({
        error: 'Item not found',
      });
    });

    it('should return 400 for invalid ID', async () => {
      const response = await request(app).get('/items/abc').expect(400);

      expect(response.body).toEqual({
        error: 'Invalid item ID',
      });
    });
  });

  // POST /items tests
  describe('POST /items', () => {
    it('should create new item with valid data', async () => {
      const itemData = {
        name: 'New Item',
        description: 'New Description',
      };

      const response = await request(app)
        .post('/items')
        .send(itemData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: 1,
        name: 'New Item',
        description: 'New Description',
      });
    });

    it('should auto-increment IDs', async () => {
      await request(app)
        .post('/items')
        .send({ name: 'Item 1', description: 'Description 1' });

      const response = await request(app)
        .post('/items')
        .send({ name: 'Item 2', description: 'Description 2' });

      expect(response.body.id).toBe(2);
    });

    it('should trim whitespace from input', async () => {
      const response = await request(app)
        .post('/items')
        .send({
          name: '  Trimmed Name  ',
          description: '  Trimmed Description  ',
        })
        .expect(201);

      expect(response.body.name).toBe('Trimmed Name');
      expect(response.body.description).toBe('Trimmed Description');
    });

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/items')
        .send({ description: 'Description only' })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain(
        'Name is required and must be a non-empty string',
      );
    });

    it('should return 400 for missing description', async () => {
      const response = await request(app)
        .post('/items')
        .send({ name: 'Name only' })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain(
        'Description is required and must be a non-empty string',
      );
    });

    it('should return 400 for empty name', async () => {
      const response = await request(app)
        .post('/items')
        .send({ name: '', description: 'Valid description' })
        .expect(400);

      expect(response.body.message).toContain(
        'Name is required and must be a non-empty string',
      );
    });

    it('should return 400 for empty description', async () => {
      const response = await request(app)
        .post('/items')
        .send({ name: 'Valid name', description: '' })
        .expect(400);

      expect(response.body.message).toContain(
        'Description is required and must be a non-empty string',
      );
    });

    it('should return 400 for non-string name', async () => {
      const response = await request(app)
        .post('/items')
        .send({ name: 123, description: 'Valid description' })
        .expect(400);

      expect(response.body.message).toContain('name must be a string');
    });

    it('should return 400 for name too long', async () => {
      const longName = 'a'.repeat(101);
      const response = await request(app)
        .post('/items')
        .send({ name: longName, description: 'Valid description' })
        .expect(400);

      expect(response.body.message).toContain(
        'Name must be 100 characters or less',
      );
    });

    it('should return 400 for description too long', async () => {
      const longDescription = 'a'.repeat(501);
      const response = await request(app)
        .post('/items')
        .send({ name: 'Valid name', description: longDescription })
        .expect(400);

      expect(response.body.message).toContain(
        'Description must be 500 characters or less',
      );
    });

    it('should return 400 for invalid JSON', async () => {
      const response = await request(app)
        .post('/items')
        .send('invalid json')
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should return 400 for no request body', async () => {
      await request(app).post('/items').send().expect(400);
    });

    it('should accept maximum length strings', async () => {
      const maxName = 'a'.repeat(100);
      const maxDescription = 'b'.repeat(500);

      const response = await request(app)
        .post('/items')
        .send({ name: maxName, description: maxDescription })
        .expect(201);

      expect(response.body.name).toBe(maxName);
      expect(response.body.description).toBe(maxDescription);
    });
  });

  // PUT /items/:id tests
  describe('PUT /items/:id', () => {
    beforeEach(async () => {
      await request(app)
        .post('/items')
        .send({ name: 'Original Item', description: 'Original Description' });
    });

    it('should update existing item', async () => {
      const updateData = {
        name: 'Updated Item',
        description: 'Updated Description',
      };

      const response = await request(app)
        .put('/items/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: 1,
        name: 'Updated Item',
        description: 'Updated Description',
      });
    });

    it('should preserve ID when updating', async () => {
      const response = await request(app)
        .put('/items/1')
        .send({ name: 'New Name', description: 'New Description' })
        .expect(200);

      expect(response.body.id).toBe(1);
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .put('/items/999')
        .send({ name: 'Updated', description: 'Updated' })
        .expect(404);

      expect(response.body.error).toBe('Item not found');
    });

    it('should return 400 for invalid ID', async () => {
      const response = await request(app)
        .put('/items/abc')
        .send({ name: 'Updated', description: 'Updated' })
        .expect(400);

      expect(response.body.error).toBe('Invalid item ID');
    });

    it('should validate input on update', async () => {
      const response = await request(app)
        .put('/items/1')
        .send({ name: '', description: 'Valid description' })
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });

    it('should trim whitespace on update', async () => {
      const response = await request(app)
        .put('/items/1')
        .send({
          name: '  Updated Name  ',
          description: '  Updated Description  ',
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
      expect(response.body.description).toBe('Updated Description');
    });

    it('should return 400 for invalid JSON on update', async () => {
      const response = await request(app)
        .put('/items/1')
        .send('invalid json')
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
    });
  });

  // DELETE /items/:id tests
  describe('DELETE /items/:id', () => {
    beforeEach(async () => {
      await request(app)
        .post('/items')
        .send({ name: 'Item to Delete', description: 'Will be deleted' });
    });

    it('should delete existing item', async () => {
      const response = await request(app).delete('/items/1').expect(200);

      expect(response.body.message).toBe('Item deleted');
      expect(response.body.item).toMatchObject({
        id: 1,
        name: 'Item to Delete',
        description: 'Will be deleted',
      });
    });

    it('should actually remove item from storage', async () => {
      await request(app).delete('/items/1').expect(200);

      // Verify item is gone
      await request(app).get('/items/1').expect(404);
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app).delete('/items/999').expect(404);

      expect(response.body.error).toBe('Item not found');
    });

    it('should return 400 for invalid ID', async () => {
      const response = await request(app).delete('/items/abc').expect(400);

      expect(response.body.error).toBe('Invalid item ID');
    });

    it('should handle deleting from middle of array', async () => {
      // Create multiple items
      await request(app)
        .post('/items')
        .send({ name: 'Item 2', description: 'Second item' });

      await request(app)
        .post('/items')
        .send({ name: 'Item 3', description: 'Third item' });

      // Delete middle item
      await request(app).delete('/items/2').expect(200);

      // Verify other items still exist
      await request(app).get('/items/1').expect(200);

      await request(app).get('/items/3').expect(200);

      // Verify deleted item is gone
      await request(app).get('/items/2').expect(404);
    });
  });

  // CORS and OPTIONS tests
  describe('CORS and OPTIONS', () => {
    it('should handle OPTIONS request', async () => {
      const response = await request(app).options('/items').expect(204);

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toBe(
        'GET,HEAD,PUT,PATCH,POST,DELETE',
      );
    });
  });

  // 404 tests
  describe('404 handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route').expect(404);

      expect(response.body.error).toBe('Not Found');
    });

    it('should return 404 for unsupported methods', async () => {
      const response = await request(app).patch('/items/1').expect(404);

      expect(response.body.error).toBe('Not Found');
    });
  });

  // Integration tests
  describe('Integration Tests', () => {
    it('should perform complete CRUD operations', async () => {
      // Create
      const createResponse = await request(app)
        .post('/items')
        .send({ name: 'Integration Test Item', description: 'For testing' })
        .expect(201);

      const itemId = createResponse.body.id;

      // Read
      const readResponse = await request(app)
        .get(`/items/${itemId}`)
        .expect(200);

      expect(readResponse.body.name).toBe('Integration Test Item');

      // Update
      const updateResponse = await request(app)
        .put(`/items/${itemId}`)
        .send({
          name: 'Updated Integration Item',
          description: 'Updated for testing',
        })
        .expect(200);

      expect(updateResponse.body.name).toBe('Updated Integration Item');

      // Verify update
      const verifyResponse = await request(app)
        .get(`/items/${itemId}`)
        .expect(200);

      expect(verifyResponse.body.name).toBe('Updated Integration Item');

      // Delete
      await request(app).delete(`/items/${itemId}`).expect(200);

      // Verify deletion
      await request(app).get(`/items/${itemId}`).expect(404);
    });

    it('should handle multiple items correctly', async () => {
      const items = [
        { name: 'Item 1', description: 'First item' },
        { name: 'Item 2', description: 'Second item' },
        { name: 'Item 3', description: 'Third item' },
      ];

      // Create multiple items
      for (const item of items) {
        await request(app).post('/items').send(item).expect(201);
      }

      // Get all items
      const response = await request(app).get('/items').expect(200);

      expect(response.body).toHaveLength(3);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
      expect(response.body.map((item: any) => item.name)).toEqual([
        'Item 1',
        'Item 2',
        'Item 3',
      ]);
    });

    it('should maintain data consistency', async () => {
      // Create initial item
      await request(app)
        .post('/items')
        .send({ name: 'Consistency Test', description: 'Testing consistency' })
        .expect(201);

      // Get count
      let response = await request(app).get('/items').expect(200);

      expect(response.body).toHaveLength(1);

      // Update item
      await request(app)
        .put('/items/1')
        .send({
          name: 'Updated Consistency Test',
          description: 'Still testing',
        })
        .expect(200);

      // Verify count unchanged
      response = await request(app).get('/items').expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Updated Consistency Test');

      // Delete item
      await request(app).delete('/items/1').expect(200);

      // Verify empty
      response = await request(app).get('/items').expect(200);

      expect(response.body).toHaveLength(0);
    });
  });
});
