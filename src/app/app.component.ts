import { Component, OnInit } from '@angular/core';
import { BigNumber, ethers } from 'ethers';
import cdaiABI from './abi/cdai.json';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  title = 'exactly dapp';
  readonly cdai = '0xF0d0EB522cfa50B716B3b1604C4F0fA6f04376AD'; //kovan
  readonly comptroller = '0x5eae89dc1c671724a672ff0630122ee834098657'; //kovan
  public balance = "";
  public connected = false;
  public amount = 0;
  public currentAddress = '';
  public events: string[] = [];
  provider = new ethers.providers.Web3Provider(window.ethereum, "any");

  ngOnInit(): void {
    this.provider.detectNetwork().then(async (network: ethers.providers.Network) => {
      if (network.name != "kovan") {
        alert("wrong network, please switch to kovan");
      }
      console.log("current network", network);
    });
  }

  async connect() {
    this.provider.send("eth_requestAccounts", [])
      .then(async (result: any) => {
        this.connected = true;
        this.currentAddress = result[0];
        this.getCurrentBalance();
      });
  }

  async getCurrentBalance() {
    let cDAI = new ethers.Contract(this.cdai, cdaiABI, this.provider);
    let balance = await cDAI["balanceOf"](this.currentAddress);
    this.balance = ethers.utils.formatUnits(balance, 8);
  }

  async deposit() {
    let daiAmount = ethers.utils.parseUnits(this.amount.toString(), "ether");
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    const signer = provider.getSigner();
    const currentAddress = await signer.getAddress();

    let cDAI = new ethers.Contract(this.cdai, cdaiABI, provider);

    let allowed = await cDAI["allowance"](currentAddress, this.comptroller);
    let signerContract = cDAI.connect(signer);

    this.listenToEvents(signerContract);

    if (allowed.lt(daiAmount)) {
      await signerContract["approve"](this.comptroller, daiAmount);
      cDAI["approve"](this.comptroller, daiAmount);
    }

    let tx = await signerContract["mint"](daiAmount);
    console.log("tx", tx);
  }

  listenToEvents(contract: ethers.Contract) {
    contract.on("Mint", (minter: string, mintAmount: BigNumber, mintTokens: BigNumber) => {
      let dai = ethers.utils.formatUnits(mintAmount, 'ether');
      this.events.push(`address ${minter} minted ${mintTokens} cDAI tokens and deposited ${dai} DAI`);
    });
  }
}