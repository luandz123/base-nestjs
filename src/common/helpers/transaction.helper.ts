import { DataSource, EntityManager } from 'typeorm';

/**
 * TransactionHelper - Utility wrapper cho TypeORM transactions
 *
 * Giúp thực hiện nhiều operations trong 1 transaction đảm bảo atomicity.
 * Nếu bất kỳ operation nào fail → rollback tất cả.
 *
 * @example
 * // Inject vào service
 * constructor(
 *   private readonly transactionHelper: TransactionHelper,
 * ) {}
 *
 * // Sử dụng
 * await this.transactionHelper.run(async (manager) => {
 *   const userRepo = manager.getRepository(User);
 *   const profileRepo = manager.getRepository(Profile);
 *   const user = await userRepo.save(userData);
 *   await profileRepo.save({ ...profileData, userId: user.id });
 *   return user;
 * });
 *
 * @see https://typeorm.io/transactions
 * @see https://docs.nestjs.com/techniques/database#transactions
 */
export class TransactionHelper {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Chạy callback trong 1 transaction
   * Auto commit nếu thành công, auto rollback nếu lỗi
   *
   * @param fn - Callback nhận EntityManager, trả về kết quả
   * @returns Kết quả từ callback
   * @throws Error gốc nếu transaction fail
   */
  async run<R>(fn: (manager: EntityManager) => Promise<R>): Promise<R> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await fn(queryRunner.manager);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
