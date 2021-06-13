import { app } from '../app';
import { withErrorHandling } from './../utils/errorMiddleware';
import matchingService from '../services/MatchingService';

app.post(
  '/matching',
  withErrorHandling(async function (req, res) {
    const userId = req?.query?.id;

    if (typeof userId !== 'string') {
      throw Error('err');
    }

    const result = await matchingService.findMatch(parseInt(userId));

    res.status(200).json(result);
  })
);

app.get(
  '/matching',
  withErrorHandling(async function (req, res) {
    const userId = req?.query?.id;

    if (typeof userId !== 'string') {
      throw Error('err');
    }

    const result = await matchingService.getActiveMatches(parseInt(userId));

    res.status(200).json(result);
  })
);
