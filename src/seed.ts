import DataSource from './data-source';
import { Calculation } from './mortgage/entities/calculation';

async function seed() {
  const dataSource = DataSource;
  await dataSource.initialize();
  const repository = dataSource.getRepository(Calculation);
  const object = {
    interestRate: 15.0,
    mortgageAmount: 100000.0,
    mortgageTermMonths: 24.0,
    monthlyPayment: 4848.664804695115,
    totalDebt: 116367.95531268275,
    overPayment: 16367.955312682752,
  };
  await repository.save(object);
  await dataSource.destroy();
}
seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
