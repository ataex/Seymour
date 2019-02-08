#pragma once

#include "Shader.h"

#include <GL/glew.h>
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>

class Object3D {
public:
	glm::mat4 modelMatrix;

	Object3D() {
		this->modelMatrix = glm::mat4(1.0);
	}

	virtual void render( Shader shader ) {};
};