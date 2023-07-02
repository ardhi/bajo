import select, { Separator } from '@inquirer/select'

async function endOfISession () {
  const answer = await select({
    message: 'End of interactive session. Continue?',
    choices: [
      { value: 'y', name: 'Yes, continue' },
      { value: 'n', name: 'No, abort' },
      new Separator(),
      { value: 'e', name: 'Back to edit' }
    ]
  })
  return answer
}

export default endOfISession
