class Command {
  name: string;
  description: string;
  usage: string;
  aliases: any[];
  required: Function;
  execute: Function;

  constructor(
    name: string,
    options: {
      description: string;
      usage: string;
      aliases: any[];
      required: Function;
    },
    execute: Function
  ) {
    this.name = name;
    this.description = options.description;
    this.usage = options.usage;
    this.aliases = options.aliases;
    this.required = options.required;
    this.execute = execute;
  }
}

export default Command;
