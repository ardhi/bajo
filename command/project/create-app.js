const createApp = {
  command: 'createApp [tpl]',
  aliases: ['ca', 'a'],
  describe: 'Create a bajo application skeleton. If "tpl" is omitted, it will use the default template',
  async handler (argv) {
    console.log('wakks')
  }
}

export default createApp
