import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MockSearchProvider } from './mock-search.provider';
import { SEARCH_PROVIDER } from './search-provider.interface';

@Global()
@Module({
  providers: [
    MockSearchProvider,
    {
      provide: SEARCH_PROVIDER,
      inject: [ConfigService, MockSearchProvider],
      useFactory: (config: ConfigService, mock: MockSearchProvider) => {
        const provider = config.get<string>('search.provider', 'mock');
        if (provider !== 'mock')
          throw new Error(`Search provider "${provider}" is not installed in this build.`);
        return mock;
      },
    },
  ],
  exports: [SEARCH_PROVIDER],
})
export class SearchModule {}
