// Atmospheric scattering shader for planet atmosphere
export const atmosphereVertexShader = `
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const atmosphereFragmentShader = `
uniform vec3 glowColor;
uniform float coefficient;
uniform float power;

varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    vec3 viewDirection = normalize(-vPosition);
    float intensity = pow(coefficient + dot(viewDirection, vNormal), power);
    
    gl_FragColor = vec4(glowColor, 1.0) * intensity;
}
`;
