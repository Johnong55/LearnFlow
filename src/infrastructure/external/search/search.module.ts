import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MockSearchProvider } from './mock-search.provider';
import { SEARCH_PROVIDER } from './search-provider.interface';
import { TavilySearchProvider } from './tavily-search.provider';

@Global()
@Module({
  providers: [
    MockSearchProvider,
    TavilySearchProvider,
    {
      provide: SEARCH_PROVIDER,
      inject: [ConfigService, MockSearchProvider, TavilySearchProvider],
      useFactory: (
        config: ConfigService,
        mock: MockSearchProvider,
        tavily: TavilySearchProvider,
      ) => {
        const provider = config.get<string>('search.provider', 'mock');
        if (provider === 'mock') return mock;
        if (provider === 'tavily') return tavily;
        throw new Error(`Search provider "${provider}" is not installed in this build.`);
      },
    },
  ],
  exports: [SEARCH_PROVIDER],
})
export class SearchModule {}
