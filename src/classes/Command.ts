class Command {
  name: string;
  description: string;
  usage: string;
  aliases: any[];
  adminOnly: boolean;
  execute: Function;

  constructor(
    name: string,
    options: {
      description: string;
      usage: string;
      aliases: any[];
      adminOnly: boolean;
    },
    execute: Function
  ) {
    this.name = name;
    this.description = options.description;
    this.usage = options.usage;
    this.aliases = options.aliases;
    this.adminOnly = options.adminOnly;
    this.execute = execute;
  }

  run() {
    this.execute();
  }
}

export default Command;
