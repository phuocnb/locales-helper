import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class LocalesHelperProvider implements vscode.TreeDataProvider<Dependency> {
  constructor(private workspaceRoot: string) { }

  getTreeItem(element: Dependency): vscode.TreeItem | Thenable<vscode.TreeItem> {
    //TODO: layout each element here
      return element;
  }

  getChildren(element?: Dependency): vscode.ProviderResult<Dependency[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No dependency in empty workspace');
      return Promise.resolve([]);
    }
    return this.resolveElement(element);
  }

  private resolveElement(element?: Dependency): vscode.ProviderResult<Dependency[]> {
    if (element) {
      return Promise.resolve(
        this.getDepsInPackageJson(
          path.join(this.workspaceRoot, 'node_modules', element.label, 'package.json')
        )
      );
    }
    return this.resolvePackageJson();
  }

  private resolvePackageJson(): vscode.ProviderResult<Dependency[]> {
    const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
    if (this.pathExists(packageJsonPath)) {
      return Promise.resolve(this.getDepsInPackageJson(packageJsonPath));
    } else {
      vscode.window.showInformationMessage('Workspace has no package.json');
      return Promise.resolve([]);
    }
  }

  private toDep(moduleName: string, version: string): Dependency {
    if (this.pathExists(path.join(this.workspaceRoot, 'node_modules', moduleName))) {
      return new Dependency(
        moduleName,
        version,
        vscode.TreeItemCollapsibleState.Collapsed
      );
    } else {
      return new Dependency(moduleName, version, vscode.TreeItemCollapsibleState.None);
    }
  }

  private mapKeys(keys: string[], dependencies: any) {
    return keys.map(dep => this.toDep(dep, dependencies[dep]));
  }

  private mapDeps(dependencies: any | undefined): Dependency[] {
    if (dependencies) {
      return this.mapKeys(Object.keys(dependencies), dependencies);
    }
    return [];
  }
    /**
   * Given the path to package.json, read all its dependencies and devDependencies.
   */
  private getDepsInPackageJson(packageJsonPath: string): Dependency[] {
    if (this.pathExists(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const deps = this.mapDeps(packageJson.dependencies);
      const devDeps = this.mapDeps(packageJson.devDependencies);
      return deps.concat(devDeps);
    }
    return [];
  }

  private pathExists(p: string): boolean {
    try {
      fs.accessSync(p);
    } catch (err) {
      return false;
    }
    return true;
  }
}

class Dependency extends vscode.TreeItem {
    constructor(
      public readonly label: string,
      private version: string,
      public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
      super(label, collapsibleState);
      this.tooltip = `${this.label}-${this.version}`;
      this.description = this.version;
    }
  
    iconPath = {
      light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
      dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
    };
}  