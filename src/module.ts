import { acceptAuthReqCmd, enterPinCmd, getInfoCmd, runAuthCmd } from './commands';
import { filters } from './responseFilters';
import { Filter, Message } from './types';

const delay = async (delay: number) => {
  return new Promise(resolve => setTimeout(resolve, delay));
};

export class Aa2Module {
  private nativeAa2Module: any

  constructor(aa2Implementation: any) {
    this.nativeAa2Module = aa2Implementation
  }

  private async sendCmd(command: Object): Promise<void> {
    const res = await this.nativeAa2Module.sendCMD(JSON.stringify(command));
    if (!res) {
      throw new Error('TODO: Sending failed');
    }
    return;
  }

  private async waitTillCondition(filter: Filter, pollInterval = 1500) {
    await delay(pollInterval);
    return this.getNewEvents()
      .then(messages => (messages || []).filter(filter)[0])
      .then(message => {
        return message || this.waitTillCondition(filter);
      });
  };

  public async getNewEvents(): Promise<Message[]> {
    return this.nativeAa2Module.getNewEvents().then(events => {
      // Can be an array of strings, or an empty array
      if (events.length) {
        return events.map(JSON.parse);
      }
      return [];
    })
  }

  public async initAa2Sdk() {
    return this.nativeAa2Module.initAASdk().then(() =>
      this.waitTillCondition(filters.initMsg)
    )
  }

  public async getInfo() {
    return this.sendCmd(getInfoCmd()).then(() => this.waitTillCondition(filters.infoMsg));
  };

  public async runAuth(tcTokenUrl: string) {
    return this.sendCmd(runAuthCmd(tcTokenUrl)).then(_ =>
      this.waitTillCondition(filters.accessRightsMsg),
    );
  };

  public async cancelAuth() {
    return this.sendCmd({cmd: 'CANCEL'}) // ?
  }

  public async enterPin(pin: number) {
    return this.sendCmd(enterPinCmd(pin)).then(() => this.waitTillCondition(filters.authMsg))
  }

  public async checkIfCardWasRead() {
    return this.waitTillCondition(filters.enterPinMsg)
  }

  public async acceptAuthRequest() {
    return this.sendCmd(acceptAuthReqCmd()).then(() =>
      this.waitTillCondition(filters.insertCardMsg),
    );
  };

  public async getApiLevel() {
    return this.sendCmd({cmd: 'GET_API_LEVEL'}).then(() =>
      this.waitTillCondition(filters.apiLvlMsg),
    );
  }
}
