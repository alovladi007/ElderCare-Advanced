import { Module, Global } from '@nestjs/common';
import { EventStreamingService } from './services/event-streaming.service';

@Global() // Make event streaming available globally
@Module({
  providers: [EventStreamingService],
  exports: [EventStreamingService],
})
export class EventStreamingModule {}
