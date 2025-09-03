# System Hook

A **hook** refers to a mechanism that allows you to inject custom function to extend Bajo's functionality at specific points. These points are typically predefined by the framework, providing opportunities to execute code before, during, or after a particular operation.

## Usage

In Bajo, hooks can be created anywhere in the code very easily. Simply call the ```runHook``` method followed by the parameters you want to pass.

The hook name is always in the form of [TNsPairs](../docs/global.html#TNsPathPairs), while its parameter is a rest parameter. This means you can pass any number of parameters to the function or none at all.

Example:

- In your JavaScript file, add the following code snippet:

  ```javascript
  const { runHook } = this.app.bajo
  await runHook('main:sayHello', 'Don', 'Meri', { movie: 'Jumbo', year: 2025 })
  ````
- Go to ```{project-dir}/main/extend/bajo/hook```. Create the directory if it doesn't exist yet.
- Create file ```main@say-hello.js``` in the directory above.
- Enter these lines:
  ```javascript
  async function sayHello (...params) {
    const [mainChar, friend, payload] = params
    console.log(mainChar, friend, payload) // output: Don, Meri, { movie: 'Jumbo', year: 2025 }
  }

  export default sayHello
  ```

Note the hook name and its associated file name:

```main:sayHello``` → ```main@say-hello.js```

It is because the colon ```:``` is prohibited to use in file name, thus replaced by the ```@``` symbol.

During boot process, Bajo will scan for hook files and load them up to the hook list. At time
when executed, Bajo will find related function from the list. If such hook exist, its function handler will be called.

## Anatomy

Many times, there are more than one handler listen for one particular hook name. Especially in a framework which use plugins extensively like Bajo, many plugin can listen to one hook at the same time. This arise a problem with call orders.

To overcome this problem, Bajo gives you the opportunity to set ```level```. Functions with lower level will be called earlier. Functions with no level will be assigned level 999 by default.

Now, change your ```main@say-hello.js``` file above to export an object instead of a function:

```javascript
const sayHello = {
  level: 10, // <-- will get called early
  handler: async function (...params) {
    const [mainChar, friend, payload] = params
    console.log(mainChar, friend, payload) // output: Don, Meri, { movie: 'Jumbo', year: 2025 }
  }
}
```

## Caveats

Hooks gives you a lot of flexibility and freedom. But you need to know the following caveats:

- You need to use an async function. Even though your function is synchronous, it will get called as an asynchronous one - and as you knew it, there is a performance degradation by using async operation.
- **Stay away** of using ```runHook``` inside a hook! Even though it is possible, your code will get unreadable and messy pretty soon.
- Hook is hard to trace on error. And because its sequential nature, if one of the handlers got called earlier than yours and throw error, your hook is not going to get called at all.
- If you use so many plugins that use hook system so extensively with so many files, your app's boot time can take much longer than it suppose to be.

So my advice is: **use it wisely**. Don't use it unless necessary; this will make your app or plugin clean and easy to understand.
