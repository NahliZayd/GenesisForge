import TerrainWorker from '../workers/TerrainWorker.ts?worker';
import { Vector3, Vector2 } from 'three';

interface WorkerTask {
    resolve: (data: any) => void;
    id: number;
}

export class WorkerManager {
    static instance: WorkerManager;
    private worker: Worker;
    private tasks: Map<number, WorkerTask> = new Map();
    private nextId = 0;

    constructor() {
        this.worker = new TerrainWorker();
        this.worker.onmessage = (e) => this.handleMessage(e);
    }

    static getInstance() {
        if (!WorkerManager.instance) {
            WorkerManager.instance = new WorkerManager();
        }
        return WorkerManager.instance;
    }

    handleMessage(e: MessageEvent) {
        const { id, positions, colors, indices } = e.data;
        const task = this.tasks.get(id);
        if (task) {
            task.resolve({ positions, colors, indices });
            this.tasks.delete(id);
        }
    }


    generateGeometry(faceNormal: Vector3, min: Vector2, max: Vector2, resolution: number, radius: number, params: any): Promise<any> {
        return new Promise((resolve) => {
            const id = this.nextId++;
            this.tasks.set(id, { resolve, id });

            this.worker.postMessage({
                id,
                faceNormal: faceNormal.toArray(),
                min,
                max,
                resolution,
                radius,
                params
            });
        });
    }
}
