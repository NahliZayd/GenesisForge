import * as THREE from 'three';

export class MathUtils {
    // Converts a point on a cube face (faceNormal, u, v) to a point on the unit sphere
    static cubeToSphere(faceNormal: THREE.Vector3, u: number, v: number): THREE.Vector3 {
        const localPoint = new THREE.Vector3();

        const up = new THREE.Vector3(0, 1, 0);

        if (Math.abs(faceNormal.y) > 0.9) {
            up.set(0, 0, 1);
        }

        const tangent = new THREE.Vector3().crossVectors(up, faceNormal).normalize();
        const binormal = new THREE.Vector3().crossVectors(faceNormal, tangent).normalize();

        localPoint.copy(faceNormal)
            .addScaledVector(tangent, u)
            .addScaledVector(binormal, v);

        return localPoint.normalize();
    }
}
