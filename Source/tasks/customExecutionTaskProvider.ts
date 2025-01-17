// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as vscode from "vscode";

import { TaskDefinition } from "./taskDefinition";
import TaskPseudoterminal from "./taskPseudoterminal";
import { PseudoterminalWriter } from "./taskPseudoterminalWriter";

export default class CustomExecutionTaskProvider
	implements vscode.TaskProvider
{
	constructor(
		private readonly callback: (
			definition: TaskDefinition,
			writer: PseudoterminalWriter,
			token?: vscode.CancellationToken,
		) => Promise<number | void>,
		private readonly isBackgroundTask?: boolean,
		private readonly problemMatchers?: string[],
	) {}

	provideTasks(): vscode.ProviderResult<vscode.Task[]> {
		return [];
	}

	resolveTask(task: vscode.Task): vscode.ProviderResult<vscode.Task> {
		const problemMatchers =
			task.problemMatchers && task.problemMatchers.length > 0
				? task.problemMatchers
				: this.problemMatchers !== undefined
					? this.problemMatchers
					: [];

		const resolvedTask = new vscode.Task(
			task.definition,
			task.scope || vscode.TaskScope.Workspace,
			task.name,
			task.source,
			new vscode.CustomExecution((resolvedDefinition) =>
				Promise.resolve(
					new TaskPseudoterminal((writer, token) =>
						this.callback(resolvedDefinition, writer, token),
					),
				),
			),
			problemMatchers,
		);

		resolvedTask.isBackground =
			this.isBackgroundTask !== undefined
				? this.isBackgroundTask
				: task.isBackground;

		return resolvedTask;
	}
}
