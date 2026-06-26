import { INestApplication, ValidationPipe } from '@nestjs/common';

export function initApp(app: INestApplication<any>) {
  // Enable CORS
  app.enableCors({});

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({}));
}
