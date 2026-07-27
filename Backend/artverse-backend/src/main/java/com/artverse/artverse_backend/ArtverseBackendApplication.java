package com.artverse.artverse_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class ArtverseBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(ArtverseBackendApplication.class, args);
	}

}
