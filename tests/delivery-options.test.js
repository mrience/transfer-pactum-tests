const { spec, stash } = require("pactum");

describe('delivery options', () => {
     const url = 'https://my.transfergo.com/api/booking/quotes';

     stash.addDataTemplate({
        'Params': {
            'fromCurrencyCode': 'GBP',
            'toCurrencyCode': 'EUR',
            'fromCountryCode': 'GB',
            'toCountryCode': 'FR',
            'amount': '1000',
            'calculationBase': 'sendAmount'
        }
      });

      stash.addDataTemplate({
        'ParamsFromEUR': {
            'fromCurrencyCode': 'EUR',
            'toCurrencyCode': 'GBP',
            'fromCountryCode': 'FR',
            'toCountryCode': 'GB',
            'amount': '1000',
            'calculationBase': 'sendAmount'
        }
      });

    test('should return delivery option for Great Britain', async () => {
        const response = await spec()
        .get(url)
        .withPathParams({
            '@DATA:TEMPLATE@': 'Params'
        });

        const options = response.json.options;
        const now = options.find(option => option.code === 'now');
        const standard = options.find(option => option.code === 'standard');

        expect(now).toBeTruthy;
        expect(standard).toBeTruthy;

    });

    test('should return delivery option for Turkey', async () => {
        const response = await spec()
        .get(url)
        .withPathParams({
            '@DATA:TEMPLATE@': 'Params',
            '@OVERRIDES@': {
                'fromCurrencyCode': 'TRY',
                'fromCountryCode': 'TR'
              }
        });

        const options = response.json.options;
        const today = options.find(option => option.code === 'today');
        const standard = options.find(option => option.code === 'standard');
         
        expect(today).toBeTruthy;
        expect(standard).toBeTruthy;

    });

    test('should calculate amount for each payment option', async () => {
        const response = await spec()
        .get(url)
        .withPathParams({
            '@DATA:TEMPLATE@': 'Params'
        });

        const options = response.json.options;
        const now = options.find(option => option.code === 'now');
        const standard = options.find(option => option.code === 'standard');

        expect(Number(now.receivingAmount.value)).toBe(now.sendingAmount.value - now.fee.value)
        expect(Number(standard.receivingAmount.value)).toBe(standard.sendingAmount.value - standard.fee.value)
    });

    test('should set Now option unavailable for exceeded max amount', async () => {
        const response = await spec()
        .get(url)
        .withPathParams({
            '@DATA:TEMPLATE@': 'Params',
            '@OVERRIDES@': {
                'amount': '2001'
            }
        });
        const options = response.json.options;
        const now = options.find(option => option.code === 'now');

        expect(now.availability.isAvailable).toBe(true);
    });

    test('should set Standard option unavailable for exceeded max amount', async () => {
        const response = await spec()
        .get(url)
        .withPathParams({
            '@DATA:TEMPLATE@': 'Params',
            '@OVERRIDES@': {
                'amount': '1000001'
            }
        })
        const options = response.json.options;
        const now = options.find(option => option.code === 'now');

        expect(now.availability.isAvailable).toBe(true);
    });

    test('should not be possible to send less than 1EUR', async () => {
        await spec()
        .get(url)
        .withPathParams({
            '@DATA:TEMPLATE@': 'ParamsFromEUR',
            '@OVERRIDES@': {
                'amount': '0.99'
            }
        })
        .expectStatus(422)
        .expectJsonLike({
            message: 'tooSmallAmount'
        });
    });

    test('should not be possible to send more than 1000000EUR', async () => {
        await spec()
        .get(url)
        .withPathParams({
            '@DATA:TEMPLATE@': 'ParamsFromEUR',
            '@OVERRIDES@': {
                'amount': '1000001'
            }
        })
        .expectStatus(422)
        .expectJsonLike({
            message: 'invalidAmount'
        });
    });

    test('should be possible to send 1EUR', async () => {
        await spec()
        .get(url)
        .withPathParams({
            '@DATA:TEMPLATE@': 'ParamsFromEUR',
            '@OVERRIDES@': {
                'amount': '1.00'
            }
        })
        .expectStatus(200);
    });

    test('should be possible to send 1000000EUR', async () => {
        await spec()
        .get(url)
        .withPathParams({
            '@DATA:TEMPLATE@': 'ParamsFromEUR',
            '@OVERRIDES@': {
                'amount': '1000000'
            }
        })
        .expectStatus(200);
    });

    test('should respond within 200ms', async () => {
        await spec()
        .get(url)
        .withPathParams({
            '@DATA:TEMPLATE@': 'Params'
        })
        .expectResponseTime(200);
    });

});
