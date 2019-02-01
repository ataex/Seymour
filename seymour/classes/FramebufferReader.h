#include <jpeglib.h>

class FramebufferReader {
public:
	// Image writting
    size_t bytesPerPixel;// = 3;    // RGB
    size_t imageSizeInBytes;// = bytesPerPixel * size_t(SCREEN_WIDTH) * size_t(SCREEN_HEIGHT);
    unsigned char* pixels;// = static_cast<unsigned char*>(malloc(imageSizeInBytes));
    int screen_width;
    int screen_height;

    FramebufferReader( size_t bytesPerPixel, int screen_width, int screen_height ) {
    	this->bytesPerPixel = bytesPerPixel;
    	this->screen_width = screen_width;
    	this->screen_height = screen_height;
    	this->imageSizeInBytes = bytesPerPixel * size_t(this->screen_width) * size_t(this->screen_height);
    	this->pixels = static_cast<unsigned char*>(malloc(imageSizeInBytes));
    }

    void writeFrameToCout() {
    	// Read the pixels from the frame buffer
        glPixelStorei(GL_PACK_ALIGNMENT, 1);
        glReadPixels(0, 0, this->screen_width, this->screen_height, GL_RGB, GL_UNSIGNED_BYTE, this->pixels);
        
        // leifchri: is there not a faster way to do this? Why doesn't the frame buffer draw flipped?
        // flip the image along the x-axis
        flipImage(this->pixels, this->screen_width, this->screen_height, this->imageSizeInBytes);
        
        //writeJpeg(pixels, SCREEN_WIDTH, SCREEN_HEIGHT, filename);
        writeJpeg(this->pixels, this->screen_width, this->screen_height, "./frame.jpeg");

        // vars for file reading
        FILE * pFile;
        long lSize;
        char * buffer;
        size_t result;

        pFile = fopen ( "./frame.jpeg" , "rb" );
        if (pFile==NULL) {fputs ("File error",stderr); exit (1);}

        // obtain file size:
        fseek (pFile , 0 , SEEK_END);
        lSize = ftell (pFile);
        rewind (pFile);

        // allocate memory to contain the whole file:
        buffer = (char*) malloc (sizeof(char)*lSize);
        if (buffer == NULL) {fputs ("Memory error",stderr); exit (2);}

        // copy the file into the buffer:
        result = fread (buffer,1,lSize,pFile);
        if (result != lSize) {fputs ("Reading error",stderr); exit (3);}

        std::cout << std::string(buffer,lSize);

        free(buffer);
    }

    ~FramebufferReader() {
    	free(pixels);
    }

private:
	void flipImage(unsigned char* pixels, int screenWidth, int screenHeight, size_t imageSizeInBytes) {
	    for (int row=0; row<(screenHeight/2); row++) {
	        for (int i=0; i<screenWidth*3; i++) {
	            int index1 = screenWidth*3*row + i;
	            int index2 = int(imageSizeInBytes - screenWidth*3*(row+1) + i);
	            unsigned char temp = pixels[index1];
	            pixels[index1] = pixels[index2];
	            pixels[index2] = temp;
	        }
	    }
	}

	// leifchri: is there a library to write pixels to jpeg? at the very least put this in seperate file
	void writeJpeg(unsigned char* pixels, int windowWidth, int windowHeight, std::string filename) {
	    struct jpeg_compress_struct cinfo;
	    struct jpeg_error_mgr jerr;
	    FILE * outfile;        /* target file */
	    JSAMPROW row_pointer[1];    /* pointer to JSAMPLE row[s] */
	    int row_stride;        /* physical row width in image buffer */
	    
	    /* Step 1: allocate and initialize JPEG compression object */
	    cinfo.err = jpeg_std_error(&jerr);
	    /* Now we can initialize the JPEG compression object. */
	    jpeg_create_compress(&cinfo);
	    
	    /* Step 2: specify data destination (eg, a file) */
	    if ((outfile = fopen(filename.c_str(), "wb")) == NULL) {
	        fprintf(stderr, "can't open %s\n", filename.c_str());
	        exit(1);
	    }
	    jpeg_stdio_dest(&cinfo, outfile);
	    /* Step 3: set parameters for compression */
	    cinfo.image_width = windowWidth;     /* image width and height, in pixels */
	    cinfo.image_height = windowHeight;
	    cinfo.input_components = 3;        /* # of color components per pixel */
	    cinfo.in_color_space = JCS_RGB;     /* colorspace of input image */
	    jpeg_set_defaults(&cinfo);
	    jpeg_set_quality(&cinfo, 50, TRUE);
	    /* Step 4: Start compressor */
	    jpeg_start_compress(&cinfo, TRUE);
	    /* Step 5: while (scan lines remain to be written) */
	    row_stride = windowWidth * 3;    /* JSAMPLEs per row in image_buffer */
	    
	    while (cinfo.next_scanline < cinfo.image_height) {
	        row_pointer[0] = & pixels[cinfo.next_scanline * row_stride];
	        (void) jpeg_write_scanlines(&cinfo, row_pointer, 1);
	    }
	    /* Step 6: Finish compression */
	    jpeg_finish_compress(&cinfo);
	    /* After finish_compress, we can close the output file. */
	    fclose(outfile);
	    /* Step 7: release JPEG compression object */
	    jpeg_destroy_compress(&cinfo);
	    
	    return;
	}
};