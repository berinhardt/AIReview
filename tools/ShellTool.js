import Docker from 'dockerode';
import path from 'path';
import { Buffer } from 'buffer';
import { setTimeout } from 'timers/promises';

const docker = new Docker();
const EXECUTION_TIMEOUT = 300000; // 5 minutes

/**
 * Executes a shell command in an isolated Docker container.
 *
 * @param {Object} params - The parameters for the shell command.
 * @param {string} params.command - The command to execute.
 * @param {Object} ENV - The environment context.
 * @returns {Promise<{stdout: string, stderr: string, exitCode: number | null}>}
 */
export async function ShellTool({ command }, ENV) {
    const { notesDir, targetDir } = ENV;
    
    // Ensure paths are absolute
    const absNotesDir = path.resolve(notesDir);
    const absTargetDir = path.resolve(targetDir);

    const containerConfig = {
        Image: 'alpine:latest',
        Cmd: ['/bin/sh', '-c', command],
        HostConfig: {
            AutoRemove: true,
            Binds: [
                `${absNotesDir}:/sandbox`,
                `${absTargetDir}:/sandbox/drive`
            ]
        },
        WorkingDir: '/sandbox'
    };

    try {
        const container = await docker.createContainer(containerConfig);
        await container.start();

        // Wait for container to finish
        const waitPromise = container.wait();
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Command timed out')), EXECUTION_TIMEOUT)
        );
        
        const data = await Promise.race([waitPromise, timeoutPromise]);
        
        // Get logs
        const logs = await container.logs({
            stdout: true,
            stderr: true,
            follow: false
        });

        // Docker logs are multiplexed. 
        // Header: 8 bytes (type, 0, 0, 0, size1, size2, size3, size4)
        // We need to demux it.
        
        let stdout = '';
        let stderr = '';
        
        // Simple demuxing
        let buffer = Buffer.from(logs);
        let offset = 0;
        while (offset < buffer.length) {
            const type = buffer.readUInt8(offset);
            const size = buffer.readUInt32BE(offset + 4);
            const content = buffer.slice(offset + 8, offset + 8 + size);
            
            if (type === 1) { // stdout
                stdout += content.toString('utf-8');
            } else if (type === 2) { // stderr
                stderr += content.toString('utf-8');
            }
            
            offset += 8 + size;
        }

        return {
            stdout,
            stderr,
            exitCode: data.StatusCode
        };
    } catch (error) {
        return {
            stdout: '',
            stderr: error.message,
            exitCode: -1
        };
    }
}

ShellTool.TOOLDEF = {
    type: 'function',
    name: 'ShellTool',
    description: 'Execute a shell command in an isolated Docker container.',
    parameters: {
        type: 'object',
        properties: {
            command: { type: 'string', description: 'The shell command to execute.' }
        },
        required: ['command']
    }
};
