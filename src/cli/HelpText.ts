export class HelpText {
  public render(): string {
    return [
      "Document: init [w] [h] | read <file.svg> | save [file.svg] | canvas [w] [h]",
      "Create:   create <rect|circle|ellipse|line|text|g> <id> [params...] [in <gid>]",
      "Edit:     delete <id> | move <id> <dx> <dy> | scale <id> <factor>",
      "          set <id> <attr> <value> | group <gid> <id...> | ungroup <gid>",
      "          addto <gid> <id> | front <id> | back <id>",
      "View:     tree [id] | show <id> | help",
      "History:  undo | redo",
      "Exit:     exit | quit",
    ].join("\n");
  }
}
