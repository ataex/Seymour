#pragma once

#include <vector>

#include "Object3D.h"

class Scene {
public:
	vector<Object3D*> children;

	Scene() {}

	void add( Object3D *object ) {
		children.push_back( object );
	}
};