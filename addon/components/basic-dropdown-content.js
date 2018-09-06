import Component, { tracked } from "sparkles-component";

export default class BasicDropdownContent extends Component {
  @tracked('destination')
  get destinationElement() {
    return document.getElementById(this.args.destination);
  }
}
