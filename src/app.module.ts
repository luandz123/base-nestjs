import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UserModule } from './modules/user/user.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';

@Module({
  imports: [
    // Load .env file globally
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // TypeORM with MSSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mssql',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 1433),
        username: configService.get<string>('DB_USERNAME', 'sa'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE', 'quan_ly_dh'),
        autoLoadEntities: true,
        synchronize: true, // Chỉ dùng cho dev, production nên dùng migrations
        options: {
          encrypt: false, // Set true nếu dùng Azure SQL
          trustServerCertificate: true,
        },
      }),
      inject: [ConfigService],
    }),

    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global JWT Auth Guard - tất cả route mặc định cần auth
    // Dùng @Public() decorator để đánh dấu route không cần auth
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global Roles Guard - kiểm tra role nếu route có @Roles() decorator
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
