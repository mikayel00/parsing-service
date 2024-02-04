import { Module } from '@nestjs/common';
import { ParserModule } from './modules/parser/parser.module';

@Module({
  imports: [ParserModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
