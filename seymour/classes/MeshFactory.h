#pragma once

#include <vector>

#include "Mesh.h"
#include "TextureLoader.h"

class MeshFactory {
public:
	static Mesh quadMesh(float xmax, int nx, float ymax, int ny) {
        float dx = (xmax*2.0f)/(float)(nx-1);
        float dy = (ymax*2.0f)/(float)(ny-1);
        float du = 1.0/(float)(nx-1);
        float dv = 1.0/(float)(ny-1);

        vector<Vertex> vertices;
        vector<GLuint> indices;
        vector<Texture> textures;

        for (GLuint y=0; y<ny; y++) {
            for (GLuint x=0; x<nx; x++) {
                Vertex vertex;
                glm::vec3 position(-1.0f*xmax+dx*x, ymax-dy*y, 0.0f);
                vertex.Position = position;
                glm::vec3 normal(0.0f, 0.0f, 1.0f);
                vertex.Normal = normal;
                glm::vec2 texCoords(0.0f+du*x, 1.0f-dv*y);
                vertex.TexCoords = texCoords;

                vertices.push_back(vertex);
            }
        }

        for (GLuint i=0; i<(nx*ny)-nx-1; i++) {
            if ((i+1)%nx == 0) {
                continue;
            }

            GLuint arr[] = {i, i+1, i+nx, i+nx, i+1, i+nx+1};
            indices.insert(indices.begin(), arr, arr+6);
        }

        Texture texture;
        texture.id = TextureLoader::TextureFromFile( "gray.jpg", "res/models/cube" );
        // texture.type = typeName;
        // texture.path = str;
        textures.push_back( texture );

        return Mesh( vertices, indices, textures );
    }

private:
	MeshFactory() {}
};