import { VK_API } from '../constants/constants';
import request from '../utils/request';

class NotifyService {
  public async sendUserMsg(userId: number, text: string) {
    await request(`${VK_API}/sendUserMessage?userId=${userId}&text=${text}`, { method: 'post' });
  }

  public async mutuallyMatchNotify(userId: number, user2Id: number) {
    await request(`${VK_API}/mutuallyMatchNotify?userId=${userId}&user2Id=${user2Id}`);
  }
}

const notifyService = new NotifyService();

export default notifyService;