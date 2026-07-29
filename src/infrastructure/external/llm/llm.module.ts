import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLM_PROVIDER } from './llm-provider.interface';
import { MockLlmProvider } from './mock-llm.provider';

@Global()
@Module({
  providers: [
    MockLlmProvider,
    {
      provide: LLM_PROVIDER,
      inject: [ConfigService, MockLlmProvider],
      useFactory: (config: ConfigService, mock: MockLlmProvider) => {
        const provider = config.get<string>('ai.provider', 'mock');
        if (provider !== 'mock')
          throw new Error(`LLM provider "${provider}" is not installed in this build.`);
        return mock;
      },
    },
  ],
  exports: [LLM_PROVIDER],
})
export class LlmModule {}
