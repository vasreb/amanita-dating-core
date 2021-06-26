import { VK_API } from '../constants/constants';
import request from '../utils/request';

class NotifyService {
  public async sendUserMsg(userId: number, text: string) {
    setTimeout(async () => {
      request(`${VK_API}/sendUserMessage`, {
        method: 'post',
        data: {
          userId,
          text,
        },
      });
    }, 5);
  }

  public async mutuallyMatchNotify(userId: number, user2Id: number) {
    setTimeout(() => {
      request(`${VK_API}/mutuallyMatchNotify`, {
        data: { userId, user2Id },
      });
    }, 5);
  }
}

const notifyService = new NotifyService();

export default notifyService;
