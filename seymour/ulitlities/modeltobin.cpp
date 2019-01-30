#include "Renderer.h"
#include "Model.h"
#include "Shader.h"

#include <iostream>
#include <string>

int main(int argc, char *argv[]) {
	if (argc < 2) {
		std::cerr << "ERROR: Must supply path to .obj file." << std::endl;
		return -1;
	}

	string file(argv[1]);

	// Renderer sets up OpenGL context, required for loading model
	Renderer renderer(800, 600);

	std::cout << "Loading file\n";
	Model model(argv[1]);

	int i = file.find(".obj");
	char ext[3] = {'b', 'i', 'n'};
	for (int j=0; j<3; j++) {
		argv[1][i+j+1] = ext[j];
	}
	std::cout << argv[1] << std::endl;

	// Write info file with number of meshes and filenames
	// Iterate over meshes
		// For each mesh, write the vertices, normals, textures 

	renderer.close();

	return 0;
}