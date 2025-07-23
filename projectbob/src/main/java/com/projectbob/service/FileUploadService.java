package com.projectbob.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.*;
import java.util.*;

@Service
public class FileUploadService {
	
	@Value("${file.upload-dir}")
	private String uploadBaseDir;
	
	public String uploadFile(MultipartFile file, String subDirectory) 
			throws IOException, IllegalArgumentException {
		
		if(file.isEmpty()) {
			throw new IllegalArgumentException("업로드 할 파일이 없습니다.");
		}
		
		Path uploadPath = Paths.get(uploadBaseDir, subDirectory);
		
		if(!Files.exists(uploadPath)) {
			Files.createDirectories(uploadPath);
		}
		
		String originalFileName = file.getOriginalFilename();
		String fileExtension = "";
		if(originalFileName != null && originalFileName.contains(".")) {
			fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
		}
		String savedFilename = UUID.randomUUID().toString()+fileExtension;
		
		Path targetLocation = uploadPath.resolve(savedFilename);
		Files.copy(file.getInputStream(), targetLocation);
		
		return "/images/" + subDirectory + "/" + savedFilename;
	}
	
	public String getUploadBaseDir() {
		return uploadBaseDir;
	}
	
}
