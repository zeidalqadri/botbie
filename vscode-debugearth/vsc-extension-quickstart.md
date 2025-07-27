# Welcome to DebugEarth VS Code Extension

## What's in the folder

* This folder contains all of the files necessary for your extension.
* `package.json` - this is the manifest file that defines the location of the extension and configures the activation events and commands.
* `src/extension.ts` - this is the main file where your extension is defined. The file exports one function, `activate`, which is called the very first time your extension is activated.
* `tsconfig.json` - the TypeScript configuration file
* `src/` - the source folder for TypeScript files
* `out/` - the compiled JavaScript output folder

## Get up and running straight away

* Press `F5` to open a new window with your extension loaded.
* Run your command from the command palette by pressing (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac) and typing `DebugEarth`.
* Set breakpoints in your code inside `src/extension.ts` to debug your extension.
* Find output from your extension in the debug console.

## Make changes

* You can relaunch the extension from the debug toolbar after changing code in `src/extension.ts`.
* You can also reload (`Ctrl+R` or `Cmd+R` on Mac) the VS Code window with your extension to load your changes.

## Explore the API

* You can open the full set of our API when you open the file `node_modules/@types/vscode/index.d.ts`.

## Run tests

* Open the debug viewlet (`Ctrl+Shift+D` or `Cmd+Shift+D` on Mac) and from the launch configuration dropdown pick `Extension Tests`.
* Press `F5` to run the tests in a new window with your extension loaded.
* See the output of the test result in the debug console.
* Make changes to `src/test/suite/extension.test.ts` or create new test files inside the `src/test/suite` folder.
  * The provided test runner will only consider files matching the name pattern `**.test.ts`.
  * You can create folders inside the `test` folder to structure your tests any way you want.

## Go further

* Reduce the extension size and improve the startup time by [bundling your extension](https://code.visualstudio.com/api/working-with-extensions/bundling-extension).
* [Publish your extension](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) on the VS Code extension marketplace.
* Automate builds by setting up [Continuous Integration](https://code.visualstudio.com/api/working-with-extensions/continuous-integration).

## DebugEarth Specific

### Development Workflow

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Compile Extension**
   ```bash
   npm run compile
   ```

3. **Run Extension**
   - Press `F5` in VS Code
   - Or use Debug panel → "Run Extension"

4. **Test Features**
   - Create debugging session: `Ctrl+Shift+P` → "DebugEarth: Start Debugging Session"
   - Check Activity Bar for DebugEarth icon
   - Test tree views and debug panel

### Architecture

- **Extension.ts**: Main entry point and command registration
- **DebugEarthManager.ts**: Bridge to DebugEarth core package
- **Providers/**: Tree data providers for VS Code views
- **Panels/**: Webview panel implementations

### Dependencies

- **DebugEarth Core**: `../debugearth` npm package
- **VS Code API**: Extension host APIs
- **TypeScript**: Type safety and compilation

### Debugging Tips

- Check Debug Console for extension logs
- Use `console.log()` in extension code for debugging
- Monitor memory usage in VS Code's process explorer
- Test with different VS Code themes and settings