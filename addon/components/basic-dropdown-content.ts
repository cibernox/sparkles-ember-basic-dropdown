import Component, { tracked } from 'sparkles-component';

interface IArgs {
  destination: string;
}

export default class BasicDropdownContent extends Component<IArgs> {
  @tracked('destination')
  get destinationElement() {
    return document.getElementById(this.args.destination);
  }
}
