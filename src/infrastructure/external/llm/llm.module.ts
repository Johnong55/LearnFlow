import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudflareWorkersAiProvider } from './cloudflare-workers-ai.provider';
import { LLM_PROVIDER } from './llm-provider.interface';
import { MockLlmProvider } from './mock-llm.provider';
import { OpenAiLlmProvider } from './openai-llm.provider';

@Global()
@Module({
  providers: [
    MockLlmProvider,
    OpenAiLlmProvider,
    CloudflareWorkersAiProvider,
    {
      provide: LLM_PROVIDER,
      inject: [ConfigService, MockLlmProvider, OpenAiLlmProvider, CloudflareWorkersAiProvider],
      useFactory: (
        config: ConfigService,
        mock: MockLlmProvider,
        openai: OpenAiLlmProvider,
        cloudflare: CloudflareWorkersAiProvider,
      ) => {
        const provider = config.get<string>('ai.provider', 'mock');
        if (provider === 'mock') return mock;
        if (provider === 'openai') return openai;
        if (provider === 'cloudflare-workers-ai') return cloudflare;
        throw new Error(`LLM provider "${provider}" is not installed in this build.`);
      },
    },
  ],
  exports: [LLM_PROVIDER],
})
export class LlmModule {}
