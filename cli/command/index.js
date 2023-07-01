import { default as app, usage as appUsage } from './app.js'
import { default as plugin, usage as pluginUsage } from './plugin.js'
import { default as project, usage as projectUsage } from './project.js'
import run from './run.js'

export const commands = [app, plugin, project, run]
export const usages = [appUsage, pluginUsage, projectUsage]
